
/**
 * Metadata about a given file.
 */
export interface FileMetadata {
  filename: string;
  keep: boolean;
  tags: string[];
}

export function isFileMetadata(object: any): object is FileMetadata {
  const retVal = 'filename' in object && 'keep' in object && 'tags' in object;
  return retVal;
}
