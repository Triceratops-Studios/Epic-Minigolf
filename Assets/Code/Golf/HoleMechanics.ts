import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import BallMechanics from "./BallMechanics";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class HoleMechanics extends AirshipBehaviour {
	private isInHole: boolean;
	private killSignal = new NetworkSignal<string>("killSignal");

	OnStart() {
		if (!Game.IsServer) return;
		this.killSignal.client.OnServerEvent((gameObject) => {
			print(gameObject);
			Airship.Damage.InflictDamage(GameObject.Find(gameObject), 1000, undefined, {});
		});
	}

	OnTriggerEnter(collider: Collider): void {
		if (!Game.IsClient()) return;
		if (!collider.CompareTag("Character")) return;
		if (this.isInHole) return;
		this.isInHole = true;
		print("triggered");

		if (collider.gameObject.name === `Character_${Game.localPlayer.username}`) {
			const rb = collider.gameObject.GetComponent<Rigidbody>();
			if (rb && rb.linearVelocity.magnitude > 0.15) {
				const ballMechanics =
				GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!;
				ballMechanics.isEnabled = false;
				task.delay(1, () => {
					if (!this.isInHole) {
						ballMechanics.isEnabled = true;
						return;
					}
					ballMechanics.counter = 0;
					ballMechanics.holeText.text = `${ballMechanics.counter < 10 ? "0" + ballMechanics.counter : ballMechanics.counter}`;
					this.killSignal.client.FireServer(collider.gameObject.name);
				});
			}
		}
	}

	protected OnTriggerExit(collider: Collider): void {
		if (!Game.IsClient()) return;
		if (!collider.CompareTag("Character")) return;
		this.isInHole = false;

		if (collider.gameObject.name === `Character_${Game.localPlayer.username}`) {
			const ballMechanics = GameObject.FindGameObjectWithTag("Character").GetAirshipComponent<BallMechanics>()!;
			ballMechanics.isEnabled = true;
		}
	}
}
