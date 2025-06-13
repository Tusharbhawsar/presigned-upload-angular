// ✅ app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgIf } from '@angular/common'; // ✅ Required for *ngIf

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule, NgIf], // ✅ Include NgIf
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  protected title = 'my_project';
  file!: File;
  progress: number = -1;
  isUploading = false;
  readonly PART_SIZE = 100 * 1024 * 1024;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  async uploadFile() {
    if (!this.file) return;

    const objectKey = `uploads/${this.file.name}`;
    this.isUploading = true;

    try {
      const createUploadResp: any = await this.http.post('api/create-upload/', {
        filename: objectKey,
        fileSize: this.file.size
      }).toPromise();

      const uploadId = createUploadResp.uploadId;
      const presignedUrls = createUploadResp.parts;

      const uploadPart = async (part: any, index: number) => {
        const start = (part.partNumber - 1) * this.PART_SIZE;
        const end = Math.min(start + this.PART_SIZE, this.file.size);
        const blob = this.file.slice(start, end);

        const response = await fetch(part.url, {
          method: 'PUT',
          body: blob
        });

        const etag = response.headers.get('ETag')?.replace(/"/g, '');
        this.progress = Math.round(((index + 1) / presignedUrls.length) * 100);
        return { PartNumber: part.partNumber, ETag: etag || '' };
      };

      const uploadPromises = presignedUrls.map((part: any, index: number) =>
        uploadPart(part, index)
      );

      const etags = await Promise.all(uploadPromises);

      const complete: any = await this.http.post('/api/complete-upload/', {
        uploadId,
        filename: objectKey,
        parts: etags
      }).toPromise();

      alert("✅ Upload Complete!\nURL: " + complete.location);
    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("❌ Upload failed!");
    } finally {
      this.isUploading = false;
      this.progress = -1;
    }
  }
}
