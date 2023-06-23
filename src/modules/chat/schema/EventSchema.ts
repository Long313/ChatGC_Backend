import type { JoinRoomSchema } from './JoinRoomSchema';
import type { MessageSchema } from './MessageSchema';

export class ClientToServerSchema {
  readonly chat: MessageSchema;

  readonly join_room: JoinRoomSchema;
}

export class ServerToClientSchema {
  readonly chat: MessageSchema;
}
