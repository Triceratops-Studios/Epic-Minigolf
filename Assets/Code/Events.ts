import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class Events extends AirshipBehaviour {
	public static inHole = new NetworkSignal<number>("InHole");
	public static updateTimer = new NetworkSignal<string>("updateTimer");
	public static reportScore = new NetworkSignal<number>("reportScore");
}
