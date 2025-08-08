import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { ControlScheme, Mouse, Preferred, Touchscreen } from "@Easy/Core/Shared/UserInput";
import { Game } from "@Easy/Core/Shared/Game";
import { ActionInputType } from "@Easy/Core/Shared/Input/InputUtil";
import BallMechanics from "./BallMechanics";

export default class HoleMechanics extends AirshipBehaviour {

	OnTriggerEnter(collider: Collider): void {
    	if (!Game.IsClient()) return;
		BallMechanics.isEnabled = false;
		task.wait(0.1)
		const character = Game.localPlayer;
		print("YOU MADE IT?");
		
		if (collider.gameObject.name === `Character_${Game.localPlayer.username}`) {
			Airship.Damage.InflictDamage(collider.gameObject, 1000, undefined, {})
		}
		BallMechanics.isEnabled = true;
	}
}
