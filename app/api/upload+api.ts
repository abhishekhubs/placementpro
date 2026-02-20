import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with server-side credentials from .env
cloudinary.config({
    cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64, folder = 'PlacementPro_Uploads' } = body;

        if (!imageBase64) {
            return Response.json({ error: 'No image data provided' }, { status: 400 });
        }

        // Upload the base64 image directly to Cloudinary
        const result = await cloudinary.uploader.upload(imageBase64, {
            folder: folder,
            transformation: [{ width: 1080, crop: 'limit' }],
            resource_type: 'image',
        });

        return Response.json({
            url: result.secure_url,
            publicId: result.public_id,
        });

    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return Response.json({ error: 'Image upload failed' }, { status: 500 });
    }
}
