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
	private character: Character | undefined;
	private position: Vector3;

	public static counter = 0;
	declare public strengthBar: GameObject;
	declare public shootingIndicator: GameObject;
	declare public baseStrength: number;

	private color = ColorPallette.random();
	private updateLocation(object: GameObject, rotation: number | undefined) {
		object.transform.position = this.position;
		if (rotation && this.character) {
			if (rotation === 1) {
				const lookVec = this.character.movement.GetLookVector();
				const angleY = math.atan2(lookVec.x, lookVec.z) * (180 / math.pi);
				object.transform.rotation = Quaternion.Euler(90, angleY, 0);
			} else {
				const velocity = this.character?.movement.GetVelocity();
				if (velocity.magnitude >= 0.01) {
					const lookRotation = Quaternion.LookRotation(velocity);
					const euler = lookRotation.eulerAngles;
					object.transform.rotation = Quaternion.Euler(euler.x + 90, euler.y, euler.z);
					return euler;
				}
			}
		}
	}

	OnCollisionEnter(collision: Collision): void {
		if (!Game.IsClient()) {
			return;
		}
		const contact = collision.contacts[0];
		const normal = contact.normal;
		const currentVelocity = this.character?.movement.GetVelocity();

		if (currentVelocity && currentVelocity.magnitude > 0.1 && Vector3.Dot(currentVelocity.normalized, normal) < 0) {
			const reflected = Vector3.Reflect(currentVelocity, normal);
			task.defer(() => {
				this.character?.movement.SetVelocity(reflected.mul(currentVelocity.magnitude));
				this.character!.transform.GetComponent<Rigidbody>().linearVelocity = reflected.mul(
					currentVelocity.magnitude,
				);
			});
		}
	}

	override Start(): void {
		if (Game.IsClient()) {
			this.character = Game.localPlayer.character;
			const camera = Airship.Camera.cameraRig?.mainCamera;

			if (this.character?.gameObject !== this.gameObject) {
				Destroy(this);
			}

			Mouse.onLeftDown.Connect(() => {
				const screenPosition = Mouse.position;
				task.wait(0.1);
				const speed = this.character?.movement.GetVelocity();
				if (
					Mouse.isLeftDown &&
					!this.active &&
					this.character &&
					!this.cooldown &&
					speed &&
					speed.magnitude <= 0.1
				) {
					this.character?.movement.SetVelocity(Vector3.zero);
					const movement = this.character.movement.GetComponent<CharacterMovementSettings>();
					movement.accelerationForce = 0;

					this.active = true;
					this.instance = Instantiate(this.strengthBar);
					this.updateLocation(this.instance, undefined);

					this.pointer = Instantiate(this.shootingIndicator);
					this.updateLocation(this.pointer, 1);

					const graphics = this.pointer.GetComponentsInChildren<Image>(true);
					for (const graphic of graphics) {
						graphic.color = this.color;
					}
				}
			});

			Mouse.onLeftUp.Connect(() => {
				if (this.active) {
					if (this.character) {
						let forward = this.character.movement.GetLookVector();
						forward = new Vector3(forward.x, 0, forward.z).normalized;
						const force = forward
							.mul(
								((this.baseStrength * math.pow(this.strength * 2, 2)) / 4) * 3 +
									this.baseStrength * this.strength,
							)
							.add(new Vector3(0, 2 * this.strength, 0));
						const rb = this.character.transform.GetComponent<Rigidbody>();
						rb.AddForce(force, ForceMode.Impulse);
						const movement = this.character.movement.GetComponent<CharacterMovementSettings>();
						movement.accelerationForce = 2 * this.strength;
						BallMechanics.counter += 1;
						this.cooldown = true;
					}
				}
				this.active = false;
				Destroy(this.instance);
				this.strength = 0;
			});
		}
	}

	protected override Update(dt: number): void {
		if (!(Game.IsClient() && this.character)) {
			return;
		}
		this.position = this.character.transform.position;

		if (this.active) {
			this.updateLocation(this.pointer, 1);

			this.strength += this.change * dt;
			this.strength = math.clamp(this.strength, 0, 1);

			if (this.strength <= 0 || this.strength >= 1) {
				this.change *= -1;
			}

			const background = this.instance.transform.Find("Background");
			const bar = background?.transform.Find("Strength");
			if (bar) {
				bar.transform.localScale = new Vector3(1, this.strength, 1);
				const image = bar.transform.GetComponent<Image>();
				image.color = ColorPallette.lerp3(this.strength, 3, 2, 0);

				const shake = background.GetComponent<EasyShake>();
				if (shake) {
					const mult = math.max(0, this.strength - 0.4);
					shake.maxPositionOffset = Vector3.one.mul(0.08 * mult);
					shake.maxRotationOffsetAngles = Vector3.one.mul(25 * mult);
					shake.movementsPerSecond = 100 * mult;
				}
			}
		} else if (this.cooldown && this.pointer) {
			const rotation = this.updateLocation(this.pointer, 2);

			if (this.updating) {
				return;
			}
			this.updating = true;
			const circle = this.pointer.transform.Find("Circle");
			if (circle) {
				const graphic = circle.GetComponent<Image>();
				if (graphic && !(graphic.color.a === 0)) {
					graphic.color = new Color(1, 1, 1, 0);
					task.wait(0.1);
				}
			}

			const speed = this.character.movement.GetVelocity();
			if (speed.magnitude <= 0.1) {
				this.cooldown = false;
				Destroy(this.pointer);
				const movement = this.character.movement.GetComponent<CharacterMovementSettings>();
				movement.accelerationForce = 0;
			}
			this.updating = false;
		} else if (!this.cooldown) {
		}
	}
}
