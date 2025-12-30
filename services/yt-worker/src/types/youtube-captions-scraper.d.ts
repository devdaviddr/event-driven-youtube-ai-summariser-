declare module 'youtube-captions-scraper' {
  export interface Subtitle {
    start: number;
    dur: number;
    text: string;
  }

  export function getSubtitles(options: {
    videoID: string;
    lang?: string;
  }): Promise<Subtitle[]>;
}
