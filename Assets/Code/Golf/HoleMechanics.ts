import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { ControlScheme, Mouse, Preferred, Touchscreen } from "@Easy/Core/Shared/UserInput";
import { Game } from "@Easy/Core/Shared/Game";
import { ActionInputType } from "@Easy/Core/Shared/Input/InputUtil";
import BallMechanics from "./BallMechanics";

export default class HoleMechanics extends AirshipBehaviour {
	private isInHole: boolean;
	OnTriggerEnter(collider: Collider): void {
		if (!Game.IsClient()) return;
		if (!collider.CompareTag("Character")) return;
		if (this.isInHole) return;
		this.isInHole = true;
		print("YOU MADE IT?");

		if (collider.gameObject.name === `Character_${Game.localPlayer.username}`) {
			const rb = collider.gameObject.GetComponent<Rigidbody>();
			if (rb && rb.linearVelocity.magnitude > 0.15) {
				const ballMechanics =
					GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!;
				ballMechanics.isEnabled = false;
				task.wait(1);
				if (!this.isInHole) {
					ballMechanics.isEnabled = false;
					return;
				}
				ballMechanics.counter = 0;
				ballMechanics.holeText.text = tostring(ballMechanics.counter);
				Airship.Damage.InflictDamage(collider.gameObject, 1000, undefined, {});
			}
		}
		GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!.isEnabled = true;
	}

	protected OnTriggerExit(collider: Collider): void {
		if (!Game.IsClient()) return;
		if (!collider.CompareTag("Character")) return;
		this.isInHole = false;
	}
}
