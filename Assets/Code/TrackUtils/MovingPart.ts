import { Game } from "@Easy/Core/Shared/Game";

export default class MovingPart extends AirshipBehaviour {
	public velocity: Vector3 = new Vector3(1, 0, 0);

	public override Start(): void {
		const motion = this.gameObject.GetComponent<EasyMotion>();
		if (motion !== undefined) {
		}
	}
}
