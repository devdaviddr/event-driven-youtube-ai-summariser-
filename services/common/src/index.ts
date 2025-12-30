// Shared event types and interfaces

export interface Event {
  id: string;
  type: string;
  aggregateId: string;
  payload: any;
  occurredAt: string;
}

export interface ChannelSubscribedEvent extends Event {
  type: 'ChannelSubscribed';
  payload: {
    channelId: string;
    rssUrl: string;
    title: string;
  };
}

export interface VideoDiscoveredEvent extends Event {
  type: 'VideoDiscovered';
  payload: {
    videoId: string;
    channelId: string;
    ytId: string;
    title: string;
    publishedAt: string;
  };
}

export interface TranscriptReadyEvent extends Event {
  type: 'TranscriptReady';
  payload: {
    videoId: string;
    channelId: string;
    language: string;
    provider: string;
    text: string;
  };
}

export interface SummaryCreatedEvent extends Event {
  type: 'SummaryCreated';
  payload: {
    videoId: string;
    channelId: string;
    model: string;
    abstract: string;
    bullets: string[];
  };
}

export interface ProcessingFailedEvent extends Event {
  type: 'ProcessingFailed';
  payload: {
    videoId: string;
    stage: string;
    reason: string;
  };
}

// Event bus interface (to be implemented)
export interface EventBus {
  publish(event: Event): Promise<void>;
  subscribe(handler: (event: Event) => Promise<void>): void;
}