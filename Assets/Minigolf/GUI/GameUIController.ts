import UI from "Code/UI";
import { Game } from "@Easy/Core/Shared/Game";

export default class GameUIController extends AirshipBehaviour {
	static setColor(color: Color) {
		if (Game.IsClient()) {
			if (!UI.Current) {
				return;
			}

			// const round = UI.Current.transform.Find("Round");
			// const graphics = round.GetComponentsInChildren<Image>(true);
			// for (const graphic of graphics) {
			// 	graphic.color = color;
			// }
		}
	}
}
