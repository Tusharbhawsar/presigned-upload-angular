import boto3
from django.http import JsonResponse
from rest_framework.decorators import api_view

BUCKET_NAME = "etl-trigger-bucket-dummy"
PART_SIZE = 100 * 1024 * 1024

s3 = boto3.client("s3")

@api_view(["POST"])
def create_upload(request):
    filename = request.data["filename"]
    filesize = int(request.data["fileSize"])

    response = s3.create_multipart_upload(Bucket=BUCKET_NAME, Key=filename)
    upload_id = response["UploadId"]

    part_count = (filesize + PART_SIZE - 1) // PART_SIZE
    presigned_urls = []

    for part_number in range(1, part_count + 1):
        url = s3.generate_presigned_url(
            "upload_part",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": filename,
                "UploadId": upload_id,
                "PartNumber": part_number
            },
            ExpiresIn=3600,
            HttpMethod="PUT"
        )
        presigned_urls.append({
            "partNumber": part_number,
            "url": url
        })

    return JsonResponse({
        "uploadId": upload_id,
        "key": filename,
        "parts": presigned_urls
    })

@api_view(["POST"])
def complete_upload(request):
    # breakpoint()
    upload_id = request.data["uploadId"]
    key = request.data["filename"]
    parts = request.data["parts"]

    s3.complete_multipart_upload(
        Bucket=BUCKET_NAME,
        Key=key,
        UploadId=upload_id,
        MultipartUpload={"Parts": parts}
    )
    return JsonResponse({"status": "Upload completed"})
