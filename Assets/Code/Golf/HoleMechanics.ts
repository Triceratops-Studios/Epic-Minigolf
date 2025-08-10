import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import BallMechanics from "./BallMechanics";
import RoundSystem from "./RoundSystem";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class HoleMechanics extends AirshipBehaviour {
	private isInHole: boolean;
	private holeSend = new NetworkSignal<[player: Player, counter: number]>("holeSend");

	OnStart() {
		if (!Game.IsServer) return;
		this.holeSend.client.OnServerEvent((player, counter) => {
			RoundSystem.reportScore(player, counter);
			Airship.Damage.InflictDamage(GameObject.Find(`Character_${player.username}`), 1000, undefined, {});
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
					this.holeSend.client.FireServer(Game.localPlayer, ballMechanics.counter);
					ballMechanics.counter = 0;
					ballMechanics.holeText.text = `${ballMechanics.counter < 10 ? "0" + ballMechanics.counter : ballMechanics.counter}`;
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
