
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { processNewPhoto } from "@/lib/yandex-ai";

const s3Client = new S3Client({
  endpoint: process.env.YANDEX_STORAGE_ENDPOINT,
  region: process.env.YANDEX_REGION,
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS_KEY_ID!,
    secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY!,
  },
});

async function uploadFileToS3(file: Buffer, fileName: string, contentType: string) {
  const bucketName = process.env.YANDEX_BUCKET_NAME!;
  const key = `${Date.now()}-${fileName}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  const publicUrl = `https://${bucketName}.storage.yandexcloud.net/${key}`;
  return publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadFileToS3(buffer, file.name, file.type);

    await processNewPhoto(publicUrl);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Error uploading file." }, { status: 500 });
  }
}
