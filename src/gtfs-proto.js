/**
 * 📦 GTFS-Realtime Protocol Buffer Parser
 * Utilise protobufjs depuis CDN pour décoder les messages GTFS-RT
 */

let protobuf;
let FeedMessage;

// Proto definition GTFS-Realtime (simplifiée)
const GTFS_PROTO = `
syntax = "proto2";

message FeedMessage {
  required FeedHeader header = 1;
  repeated FeedEntity entity = 2;
}

message FeedHeader {
  required string gtfs_realtime_version = 1;
  optional uint64 timestamp = 3;
}

message FeedEntity {
  required string id = 1;
  optional TripUpdate trip_update = 3;
  optional Alert alert = 5;
}

message TripUpdate {
  required TripDescriptor trip = 1;
  optional VehicleDescriptor vehicle = 3;
  repeated StopTimeUpdate stop_time_update = 2;
}

message TripDescriptor {
  optional string trip_id = 1;
  optional string route_id = 5;
}

message VehicleDescriptor {
  optional string id = 1;
}

message StopTimeUpdate {
  optional uint32 stop_sequence = 1;
  optional string stop_id = 4;
  optional StopTimeEvent arrival = 2;
  optional StopTimeEvent departure = 3;
}

message StopTimeEvent {
  optional int64 delay = 1;
  optional int64 time = 2;
}

message Alert {
  repeated TimeRange active_period = 1;
  repeated EntitySelector informed_entity = 5;
  optional TranslatedString header_text = 10;
  optional TranslatedString description_text = 11;
}

message TimeRange {
  optional uint64 start = 1;
  optional uint64 end = 2;
}

message EntitySelector {
  optional string stop_id = 4;
  optional string route_id = 6;
}

message TranslatedString {
  repeated Translation translation = 1;
}

message Translation {
  required string text = 1;
  optional string language = 2;
}
`;

export async function loadProto() {
  if (FeedMessage) return FeedMessage;

  // Charger protobufjs depuis CDN
  if (!window.protobuf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/protobufjs@7.2.5/dist/protobuf.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  protobuf = window.protobuf;
  
  // Parser la définition proto
  const root = protobuf.parse(GTFS_PROTO).root;
  FeedMessage = root.lookupType('FeedMessage');
  
  return FeedMessage;
}

export async function decodeFeed(arrayBuffer) {
  const FeedMsg = await loadProto();
  const bytes = new Uint8Array(arrayBuffer);
  const message = FeedMsg.decode(bytes);
  return FeedMsg.toObject(message, {
    longs: Number,
    enums: String,
    bytes: String
  });
}
