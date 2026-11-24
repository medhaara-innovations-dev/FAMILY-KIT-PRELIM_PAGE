export async function contactThumbnail(file) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.size > 10 * 1024 * 1024) {
    throw new Error("Choose a JPG, PNG, or other raster photo under 10 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    const context = canvas.getContext("2d");
    for (const pixels of [128, 96, 64]) {
      canvas.width = canvas.height = pixels;
      context.fillStyle = "#fff";
      context.fillRect(0, 0, pixels, pixels);
      context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2,
        size, size, 0, 0, pixels, pixels);
      const photo = canvas.toDataURL("image/jpeg", .65).split(",")[1];
      if (photo && photo.length <= 12000) return photo;
    }
    throw new Error("Could not create a contact thumbnail.");
  } catch {
    throw new Error("Could not open this photo. Try a JPG or PNG.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
