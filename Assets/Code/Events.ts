import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { Game } from "@Easy/Core/Shared/Game";
import { Signal } from "@Easy/Core/Shared/Util/Signal";
import { Player } from "@Easy/Core/Shared/Player/Player";

export default class Events extends AirshipBehaviour {
    public static inHole = new Signal<[Player, number]>();
}
