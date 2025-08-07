import Character from "@Easy/Core/Shared/Character/Character";
import BallMechanics from "Code/Golf/BallMechanics";

export default class SpeedUp extends AirshipBehaviour {
	@Range(0.1, 10)
	public speedMult: number = 1;

	protected OnTriggerEnter(collider: Collider): void {
		const movement = collider.gameObject.GetAirshipComponent<Character>()?.movement;
		if (movement === undefined) return;
		movement.SetVelocity(movement.GetVelocity().mul(this.speedMult));
	}
}
