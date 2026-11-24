import base64
import binascii
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
LEGACY_ROLES = {
    'Emergency': ['Emergency Contact', 'Police', 'Fire Service', 'Ambulance', 'Other'],
    'Insurance': ['Insurance Agent', 'Insurance Company', 'Claims Officer', 'Other'],
    'Medical': ['Hospital', 'Doctor', 'Medical Store', 'Other'],
    'Legal': ['Lawyer', 'Legal Advisor', 'Notary', 'Other'],
    'Nominees': ['Nominee', 'Alternate Nominee', 'Other'],
    'Education': ['School', 'College', 'Teacher', 'Other'],
    'Finance': ['Bank Manager', 'Financial Advisor', 'Accountant', 'Other'],
}
ROLES = {
    'Medical & Healthcare': 'General Physician|Specialist Doctor|Dentist|Surgeon|Pediatrician|Gynecologist|Cardiologist|Nurse|Pharmacist|Hospital / Clinic|Diagnostic Lab|Medical Advisor',
    'Insurance': 'Life Insurance Agent|Health Insurance Agent|General Insurance Agent|Insurance Advisor|Insurance Broker|Insurance Consultant|Claims Advisor|Insurance Company Contact',
    'Finance & Banking': 'Financial Advisor|Financial Planner|Chartered Accountant (CA)|Accountant|Bank Manager|Banker|Loan Advisor|Tax Consultant|Investment Advisor|Mutual Fund Distributor',
    'Legal': 'Lawyer|Advocate|Legal Consultant|Property Lawyer|Civil Lawyer|Criminal Lawyer|Notary|Document Writer',
    'Education': 'Teacher|Lecturer|Principal|School Management|College Management|Career Counselor|Education Consultant|Tutor / Trainer',
    'Government & Documentation': 'Government Officer|MeeSeva / Service Centre|Passport Consultant|Visa Consultant|Registration Officer|Document Consultant|Government Office Contact',
    'Home & Property': 'Real Estate Agent|Property Consultant|Builder / Contractor|Architect|Civil Engineer|Electrician|Plumber|Carpenter|Property Manager',
    'Vehicle & Transport': 'Mechanic|Car Dealer|Bike Dealer|Vehicle Insurance Agent|Driving School|Driving Instructor|Vehicle Service Centre|Transport Service',
    'Emergency & Safety': 'Police Contact|Fire & Rescue|Emergency Response|Security Service|Ambulance Service|Disaster Management Contact',
    'Technology & Digital': 'Computer Technician|Mobile Technician|IT Consultant|Software Professional|Internet Service Provider|Cybersecurity Consultant|Digital Service Provider',
    'Travel & Hospitality': 'Travel Agent|Tour Operator|Hotel Contact|Travel Consultant|Ticket Booking Agent|Immigration Consultant',
    'Business & Work': 'Employer|Business Partner|HR Manager|Recruitment Consultant|Business Consultant|Vendor / Supplier|Client / Customer',
    'Personal & Community': 'Family Contact|Friend|Neighbour|Community Leader|Caregiver|Personal Assistant',
    'Others': '',
}
ROLES = {name: values.split('|') if values else [] for name, values in ROLES.items()}
CUSTOM_ROLE = 'Other / Custom Role'
LEGACY_CATEGORIES = {'Emergency': 'Emergency & Safety', 'Medical': 'Medical & Healthcare',
                     'Finance': 'Finance & Banking', 'Nominees': 'Personal & Community'}
PHOTO_LIMIT = 12000
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
    if len(raw.encode('utf-8')) > 20000:
        raise ValueError('Request body too large')
    body = json.loads(raw)
    if not isinstance(body, dict):
        raise ValueError('Body must be a JSON object')
    return body

def validate(body):
    allowed = {'name', 'category', 'role', 'customRole', 'relation', 'mobileNumber', 'email', 'photo'}
    if set(body) - allowed:
        raise ValueError('Unexpected contact fields')
    name = body.get('name')
    category = body.get('category')
    role = body.get('role', '')
    mobile = body.get('mobileNumber')
    email = body.get('email', '')
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 100:
        raise ValueError('Name must be 1-100 characters')
    if not isinstance(category, str) or category not in (ROLES.keys() | LEGACY_ROLES.keys()):
        raise ValueError('Invalid category')
    valid_roles = ROLES.get(category, []) + LEGACY_ROLES.get(category, [])
    if not isinstance(role, str) or (role != CUSTOM_ROLE and role not in valid_roles):
        raise ValueError('Select a valid role for this category')
    custom = body.get('customRole', '')
    if role == CUSTOM_ROLE and (not isinstance(custom, str) or not 1 <= len(custom.strip()) <= 100):
        raise ValueError('Enter a custom role of up to 100 characters')
    if not isinstance(mobile, str) or not re.fullmatch(r'\+[1-9]\d{7,14}', mobile):
        raise ValueError('Mobile number must use international format, e.g. +919876543210')
    if not isinstance(email, str) or (email and (len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email))):
        raise ValueError('Invalid email address')
    if category == 'Emergency & Safety':
        category = 'Emergency'
    data = {'name': name.strip(), 'category': category, 'role': role, 'mobileNumber': mobile, 'email': email.strip(),
            'customRole': custom.strip() if role == CUSTOM_ROLE else ''}
    if 'relation' in body:
        relation = body['relation']
        if not isinstance(relation, str) or len(relation.strip()) > 100:
            raise ValueError('Relation must be at most 100 characters')
        data['relation'] = relation.strip()
    if 'photo' in body:
        photo = body['photo']
        if not isinstance(photo, str) or len(photo) > PHOTO_LIMIT:
            raise ValueError('Invalid contact photo')
        if photo:
            try:
                pixels = base64.b64decode(photo, validate=True)
            except (ValueError, binascii.Error):
                raise ValueError('Invalid contact photo') from None
            if not pixels.startswith(b'\xff\xd8\xff') or not pixels.endswith(b'\xff\xd9'):
                raise ValueError('Contact photo must be a JPEG thumbnail')
        data['photo'] = photo
    return data

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
    changes = {**data, 'updatedAt': now}
    names = {f'#f{i}': field for i, field in enumerate(changes)}
    values = {f':v{i}': value for i, value in enumerate(changes.values())}
    expression = 'SET ' + ', '.join(f'#f{i} = :v{i}' for i in range(len(changes)))
    values[':oldupdated'] = old['updatedAt']
    condition = 'attribute_exists(contactId) AND updatedAt=:oldupdated'
    old_emergency = old['category'] == 'Emergency'
    new_emergency = data['category'] == 'Emergency'
    if old_emergency != new_emergency:
        counter_values = {':delta': {'N': '1' if new_emergency else '-1'}}
        counter_values.update({':max': {'N': '2'}} if new_emergency else {':one': {'N': '1'}})
        counter_action = {'Update': {'TableName': TABLE_NAME, 'Key': {'userId': attr(user), 'contactId': attr(COUNTER_ID)}, 'UpdateExpression': 'ADD #count :delta', 'ConditionExpression': '(attribute_not_exists(#count) OR #count < :max)' if new_emergency else '#count >= :one', 'ExpressionAttributeNames': {'#count': 'count'}, 'ExpressionAttributeValues': counter_values}}
        contact_action = {'Update': {'TableName': TABLE_NAME, 'Key': {k: attr(v) for k, v in contact_key(user, contact_id).items()},
                                     'UpdateExpression': expression, 'ConditionExpression': condition,
                                     'ExpressionAttributeNames': names, 'ExpressionAttributeValues': {k: attr(v) for k, v in values.items()}}}
        transact([counter_action, contact_action])
    else:
        table.update_item(Key=contact_key(user, contact_id), UpdateExpression=expression,
                          ConditionExpression=condition, ExpressionAttributeNames=names, ExpressionAttributeValues=values)
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
        query = event.get('queryStringParameters') or {}
        if path.endswith('/categories') and method == 'GET':
            if query.get('schema') == '2':
                return response(200, {'categories': [{'name': name, 'roles': roles + [CUSTOM_ROLE]} for name, roles in ROLES.items()]})
            return response(200, {'categories': [{'name': name, 'roles': roles} for name, roles in LEGACY_ROLES.items()]})
        if method == 'GET' and contact_id:
            item = get_contact(user, contact_id)
            return response(200, {'contact': item}) if item else response(404, {'error': 'Contact not found'})
        if method == 'GET':
            category = query.get('category', 'All')
            if category != 'All' and category not in (ROLES.keys() | LEGACY_ROLES.keys()):
                return response(400, {'error': 'Invalid category filter'})
            cursor = None
            if query.get('schema') == '2':
                args = {'KeyConditionExpression': Key('userId').eq(user), 'ConsistentRead': True, 'Limit': 50}
                if query.get('cursor'):
                    cursor_id = query['cursor']
                    if cursor_id != COUNTER_ID and str(uuid.UUID(cursor_id)) != cursor_id:
                        raise ValueError('Invalid contact cursor')
                    args['ExclusiveStartKey'] = contact_key(user, cursor_id)
                page = table.query(**args)
                items = [x for x in page.get('Items', []) if x['contactId'] != COUNTER_ID]
                cursor = page.get('LastEvaluatedKey', {}).get('contactId')
            else:
                items = [{key: value for key, value in item.items() if key != 'photo'} for item in query_all(user)]
            if category != 'All':
                items = [x for x in items if x.get('category') == category or LEGACY_CATEGORIES.get(x.get('category')) == category]
            items.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            return response(200, {'contacts': items, 'count': len(items), 'cursor': cursor})
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
