import { Game } from "@Easy/Core/Shared/Game";

export default class UI extends AirshipBehaviour {
	static Current = undefined;

	override Start(): void {
		if (Game.IsClient()) {
		}
	}
}
