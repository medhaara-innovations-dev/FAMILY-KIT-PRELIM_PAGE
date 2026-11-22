import json
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

TABLE_NAME = os.environ['CONTACTS_TABLE']
table = boto3.resource('dynamodb').Table(TABLE_NAME)
CATEGORIES = ('Emergency', 'Insurance', 'Medical', 'Legal', 'Nominees', 'Education', 'Finance')
ROLES = {
    'Emergency': ['Emergency Contact', 'Police', 'Fire Service', 'Ambulance', 'Other'],
    'Insurance': ['Insurance Agent', 'Insurance Company', 'Claims Officer', 'Other'],
    'Medical': ['Hospital', 'Doctor', 'Medical Store', 'Other'],
    'Legal': ['Lawyer', 'Legal Advisor', 'Notary', 'Other'],
    'Nominees': ['Nominee', 'Alternate Nominee', 'Other'],
    'Education': ['School', 'College', 'Teacher', 'Other'],
    'Finance': ['Bank Manager', 'Financial Advisor', 'Accountant', 'Other'],
}
COUNTER_ID = '__EMERGENCY_COUNT__'

def response(status, data):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': os.environ.get('ALLOWED_ORIGIN', '*'), 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'}, 'body': json.dumps(data, default=lambda v: int(v) if isinstance(v, Decimal) else str(v))}

def current_user(event):
    auth = event.get('requestContext', {}).get('authorizer', {})
    claims = auth.get('jwt', {}).get('claims') or auth.get('claims') or {}
    return claims.get('sub')

def read_body(event):
    if event.get('isBase64Encoded'):
        raise ValueError('Base64 request bodies are not supported')
    raw = event.get('body') or '{}'
    if len(raw.encode('utf-8')) > 12000:
        raise ValueError('Request body too large')
    body = json.loads(raw)
    if not isinstance(body, dict):
        raise ValueError('Body must be a JSON object')
    return body

def validate(body):
    allowed = {'name', 'category', 'role', 'mobileNumber', 'email'}
    if set(body) - allowed:
        raise ValueError('Unexpected contact fields')
    name = body.get('name')
    category = body.get('category')
    role = body.get('role', '')
    mobile = body.get('mobileNumber')
    email = body.get('email', '')
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 100:
        raise ValueError('Name must be 1-100 characters')
    if category not in CATEGORIES:
        raise ValueError('Invalid category')
    if not isinstance(role, str) or role not in ROLES[category]:
        raise ValueError('Select a valid role for this category')
    if not isinstance(mobile, str) or not re.fullmatch(r'\+[1-9]\d{7,14}', mobile):
        raise ValueError('Mobile number must use international format, e.g. +919876543210')
    if not isinstance(email, str) or (email and (len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email))):
        raise ValueError('Invalid email address')
    return {'name': name.strip(), 'category': category, 'role': role, 'mobileNumber': mobile, 'email': email.strip()}

def contact_key(user, contact):
    return {'userId': user, 'contactId': contact}

def get_contact(user, contact):
    if contact == COUNTER_ID:
        return None
    return table.get_item(Key=contact_key(user, contact), ConsistentRead=True).get('Item')

def query_all(user):
    result = []
    kwargs = {'KeyConditionExpression': Key('userId').eq(user), 'ConsistentRead': True}
    while True:
        page = table.query(**kwargs)
        result.extend(x for x in page.get('Items', []) if x['contactId'] != COUNTER_ID)
        if 'LastEvaluatedKey' not in page:
            break
        kwargs['ExclusiveStartKey'] = page['LastEvaluatedKey']
    return result

def transact(actions):
    boto3.client('dynamodb').transact_write_items(TransactItems=actions)

def attr(value):
    return {'S': value}

def create(user, data):
    contact_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    item = {'userId': user, 'contactId': contact_id, **data, 'createdAt': now, 'updatedAt': now}
    if data['category'] == 'Emergency':
        # Atomic counter and contact creation in one transaction.
        transact([
            {'Update': {'TableName': TABLE_NAME, 'Key': {'userId': attr(user), 'contactId': attr(COUNTER_ID)}, 'UpdateExpression': 'ADD #count :one', 'ConditionExpression': 'attribute_not_exists(#count) OR #count < :max', 'ExpressionAttributeNames': {'#count': 'count'}, 'ExpressionAttributeValues': {':one': {'N': '1'}, ':max': {'N': '2'}}}},
            {'Put': {'TableName': TABLE_NAME, 'Item': {k: attr(v) for k, v in item.items()}, 'ConditionExpression': 'attribute_not_exists(contactId)'}}
        ])
    else:
        table.put_item(Item=item, ConditionExpression='attribute_not_exists(contactId)')
    return item

def update(user, contact_id, data):
    old = get_contact(user, contact_id)
    if not old:
        return None
    now = datetime.now(timezone.utc).isoformat()
    item = {**old, **data, 'updatedAt': now}
    old_emergency = old['category'] == 'Emergency'
    new_emergency = data['category'] == 'Emergency'
    if old_emergency != new_emergency:
        counter_action = {'Update': {'TableName': TABLE_NAME, 'Key': {'userId': attr(user), 'contactId': attr(COUNTER_ID)}, 'UpdateExpression': 'ADD #count :delta', 'ConditionExpression': '(attribute_not_exists(#count) OR #count < :max)' if new_emergency else '#count >= :one', 'ExpressionAttributeNames': {'#count': 'count'}, 'ExpressionAttributeValues': {':delta': {'N': '1' if new_emergency else '-1'}, ':max': {'N': '2'}, ':one': {'N': '1'}}}}
        contact_action = {'Update': {'TableName': TABLE_NAME, 'Key': {'userId': attr(user), 'contactId': attr(contact_id)}, 'UpdateExpression': 'SET #name=:name, #cat=:cat, #role=:role, mobileNumber=:mobile, email=:email, updatedAt=:updated', 'ConditionExpression': 'attribute_exists(contactId) AND #cat = :oldcat AND updatedAt = :oldupdated', 'ExpressionAttributeNames': {'#name': 'name', '#cat': 'category', '#role': 'role'}, 'ExpressionAttributeValues': {':name': attr(data['name']), ':cat': attr(data['category']), ':role': attr(data['role']), ':mobile': attr(data['mobileNumber']), ':email': attr(data['email']), ':updated': attr(now), ':oldcat': attr(old['category']), ':oldupdated': attr(old['updatedAt'])}}}
        transact([counter_action, contact_action])
    else:
        table.update_item(Key=contact_key(user, contact_id), UpdateExpression='SET #name=:name, #cat=:cat, #role=:role, mobileNumber=:mobile, email=:email, updatedAt=:updated', ConditionExpression='attribute_exists(contactId) AND updatedAt=:oldupdated', ExpressionAttributeNames={'#name': 'name', '#cat': 'category', '#role': 'role'}, ExpressionAttributeValues={':name': data['name'], ':cat': data['category'], ':role': data['role'], ':mobile': data['mobileNumber'], ':email': data['email'], ':updated': now, ':oldupdated': old['updatedAt']})
    return item

def delete(user, contact_id):
    old = get_contact(user, contact_id)
    if not old:
        return False
    if old['category'] == 'Emergency':
        transact([
            {'Update': {'TableName': TABLE_NAME, 'Key': {'userId': attr(user), 'contactId': attr(COUNTER_ID)}, 'UpdateExpression': 'ADD #count :minus', 'ConditionExpression': '#count >= :one', 'ExpressionAttributeNames': {'#count': 'count'}, 'ExpressionAttributeValues': {':minus': {'N': '-1'}, ':one': {'N': '1'}}}},
            {'Delete': {'TableName': TABLE_NAME, 'Key': {'userId': attr(user), 'contactId': attr(contact_id)}, 'ConditionExpression': 'attribute_exists(contactId) AND #cat = :emergency AND updatedAt = :updated', 'ExpressionAttributeNames': {'#cat': 'category'}, 'ExpressionAttributeValues': {':emergency': attr('Emergency'), ':updated': attr(old['updatedAt'])}}}
        ])
    else:
        table.delete_item(Key=contact_key(user, contact_id), ConditionExpression='attribute_exists(contactId) AND #cat <> :emergency AND updatedAt = :updated', ExpressionAttributeNames={'#cat': 'category'}, ExpressionAttributeValues={':emergency': 'Emergency', ':updated': old['updatedAt']})
    return True

def lambda_handler(event, context):
    try:
        method = (event.get('requestContext', {}).get('http', {}).get('method') or event.get('httpMethod') or '').upper()
        if method == 'OPTIONS':
            return response(204, {})
        user = current_user(event)
        if not user:
            return response(401, {'error': 'Authentication required'})
        path = event.get('rawPath') or event.get('path') or ''
        path = path.rstrip('/')
        params = event.get('pathParameters') or {}
        contact_id = params.get('contactId')
        if path.endswith('/categories') and method == 'GET':
            return response(200, {'categories': [{'name': c, 'roles': ROLES[c]} for c in CATEGORIES]})
        if method == 'GET' and contact_id:
            item = get_contact(user, contact_id)
            return response(200, {'contact': item}) if item else response(404, {'error': 'Contact not found'})
        if method == 'GET':
            category = (event.get('queryStringParameters') or {}).get('category', 'All')
            if category != 'All' and category not in CATEGORIES:
                return response(400, {'error': 'Invalid category filter'})
            items = query_all(user)
            if category != 'All':
                items = [x for x in items if x.get('category') == category]
            items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            return response(200, {'contacts': items, 'count': len(items)})
        if method == 'POST' and not contact_id:
            item = create(user, validate(read_body(event)))
            return response(201, {'contact': item})
        if method == 'PUT' and contact_id:
            item = update(user, contact_id, validate(read_body(event)))
            return response(200, {'contact': item}) if item else response(404, {'error': 'Contact not found'})
        if method == 'DELETE' and contact_id:
            return response(200, {'deleted': True}) if delete(user, contact_id) else response(404, {'error': 'Contact not found'})
        return response(404, {'error': 'Route not found'})
    except (ValueError, json.JSONDecodeError) as e:
        return response(400, {'error': str(e)})
    except ClientError as e:
        code = e.response.get('Error', {}).get('Code', '')
        if code in ('TransactionCanceledException', 'ConditionalCheckFailedException'):
            return response(409, {'error': 'Contact update conflict or Emergency limit reached (maximum 2). Refresh and try again.'})
        print('DynamoDB error:', code)
        return response(500, {'error': 'Unable to process contact request'})
    except Exception as e:
        print('Unhandled error:', type(e).__name__)
        return response(500, {'error': 'Internal server error'})
