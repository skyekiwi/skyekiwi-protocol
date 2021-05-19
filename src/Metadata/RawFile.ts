export class RawFile {

  constructor(
    public filePath: string,
    public fileName: string,
    public fileNote: string,
    public fileChunkSize?: number
  ) {
    this.fileChunkSize = fileChunkSize ? fileChunkSize : 1 * (10 ** 6);
  }

  public toString() {
    return JSON.stringify({
      filePath: this.filePath,
      fileName: this.fileName,
      fileNote: this.fileNote,
      fileChunkSize: this.fileChunkSize
    })
  }
}
