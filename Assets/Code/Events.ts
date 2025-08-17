import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { Game } from "@Easy/Core/Shared/Game";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class Events extends AirshipBehaviour {
    public static inHole = new NetworkSignal<number>("InHole");
    public static updateTimer = new NetworkSignal<string>("updateTimer");
    public static reportScore = new NetworkSignal<number>("reportScore");
}
