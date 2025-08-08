import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { ControlScheme, Mouse, Preferred, Touchscreen } from "@Easy/Core/Shared/UserInput";
import { Game } from "@Easy/Core/Shared/Game";
import { ActionInputType } from "@Easy/Core/Shared/Input/InputUtil";

import ColorPallette from "Minigolf/Settings/ColorPallette";

export default class BallMechanics extends AirshipBehaviour {
	private strength = 0;
	private change = 1;
	private active = false;
	private cooldown = false;
	private updating = false;
	private instance: GameObject;
	private pointer: GameObject;
	private position: Vector3;
	private cameraTargetTransform: Transform;
	private rb!: Rigidbody;
	private lastVelocity: Vector3;

	public static isEnabled = true;
	public static counter = 0;
	declare public strengthBar: GameObject;
	declare public shootingIndicator: GameObject;
	declare public baseStrength: number;

	protected override Start(): void {
		this.rb = this.gameObject.GetComponent<Rigidbody>()!;
		task.delay(4, () => {
			this.rb.AddForce(new Vector3(1000, 100, 400));
		});
	}

	protected override Update(dt: number): void {
		if (!Game.IsClient()) return;

		this.rb.linearVelocity = this.rb.linearVelocity.mul(1 - dt / 5);

		this.lastVelocity = this.rb.linearVelocity;
	}

	protected override OnCollisionEnter(collision: Collision): void {
		if (!Game.IsClient()) {
			return;
		}

		if (collision.gameObject.layer !== LayerMask.NameToLayer("Track")) {
			return;
		}

		const contact = collision.contacts[0];
		print(contact);
		const normal = contact.normal;
		print(normal);
		const currentVelocity = this.lastVelocity;
		print(currentVelocity);

		if (currentVelocity && currentVelocity.magnitude > 0.1 && Vector3.Dot(currentVelocity.normalized, normal) < 0) {
			const reflected = Vector3.Reflect(currentVelocity, normal);
			this.rb.AddForce(reflected.mul(currentVelocity.magnitude));
		}
	}
}
