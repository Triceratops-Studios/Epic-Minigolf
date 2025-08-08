import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { ControlScheme, Mouse, Preferred, Touchscreen } from "@Easy/Core/Shared/UserInput";
import { Game } from "@Easy/Core/Shared/Game";
import { ActionInputType } from "@Easy/Core/Shared/Input/InputUtil";
import BallMechanics from "./BallMechanics";

export default class HoleMechanics extends AirshipBehaviour {
	OnTriggerEnter(collider: Collider): void {
		if (!Game.IsClient()) return;
		const character = Game.localPlayer;
		print("YOU MADE IT?");

		if (collider.gameObject.name === `Character_${Game.localPlayer.username}`) {
			const rb = collider.gameObject.GetComponent<Rigidbody>();
			if (rb && rb.linearVelocity.magnitude > 0.15) {
				GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!.isEnabled = false;
				task.wait(0.2);
				GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!.counter = 0;
				GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!.holeText.text = tostring(
					GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!.counter,
				);
				Airship.Damage.InflictDamage(collider.gameObject, 1000, undefined, {});
			}
		}
		GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!.isEnabled = true;
	}
}
