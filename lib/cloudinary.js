import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "t0zmjhmi",
  api_key: process.env.CLOUDINARY_API_KEY || "325722812694885",
  api_secret: process.env.CLOUDINARY_API_SECRET || "dKGdOuiz6dZn-F2102J58FNai14",
});

export async function uploadToCloudinary(file, folder = "smarteprint_products") {
  return new Promise((resolve, reject) => {
    // If it's a base64 string or remote URL, use direct upload
    if (typeof file === "string") {
      cloudinary.uploader.upload(
        file,
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Upload failed: ${error.message}`));
          } else {
            resolve(result?.secure_url || "");
          }
        }
      );
      return;
    }

    // If it's a buffer
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Upload failed: ${error.message}`));
        } else {
          resolve(result?.secure_url || "");
        }
      }
    );

    stream.end(file);
  });
}

export async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
}
