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
	private oldPosition: Vector3;
	private camera: Camera | undefined;
	private rb: Rigidbody;
	private rotation: Vector3;
	private lastVelocity: Vector3;

	public isEnabled = false;
	public counter = 0;
	declare public strengthBar: GameObject;
	declare public shootingIndicator: GameObject;
	declare public baseStrength: number;
	declare public holeText: TMP_Text;

	private color = ColorPallette.random();
	private updateLocation(object: GameObject, rotation: number | undefined) {
		object.transform.position = this.position;
		if (rotation && this.rb) {
			if (rotation === 1) {
				this.rotation = this.rb.transform.forward;
				const angleY = math.atan2(this.rotation.x, this.rotation.z) * (180 / math.pi);
				object.transform.rotation = Quaternion.Euler(90, angleY, 0);
			} else {
				const velocity = this.rb.linearVelocity;
				if (velocity.magnitude >= 0.01) {
					const lookRotation = Quaternion.LookRotation(velocity);
					const euler = lookRotation.eulerAngles;
					object.transform.rotation = Quaternion.Euler(euler.x + 90, euler.y, euler.z);
					return euler;
				}
			}
		}
	}

	override Start(): void {
		
		if (Game.IsClient()) {
			if (this.gameObject.name !== `Character_${Game.localPlayer.username}`) {
				Destroy(this);
			}

			const rigidbody = this.gameObject.GetComponent<Rigidbody>();
			if (rigidbody) {
				this.rb = rigidbody;
			}
			const tmpText = GameObject.Find("HitText");
			if (tmpText) {
				this.holeText = tmpText.GetComponent<TMP_Text>()!;
			}
			this.camera = Airship.Camera.cameraRig?.mainCamera;

			Mouse.onLeftDown.Connect(() => {
				const screenPosition = Mouse.position;
				task.wait(0.1);
				const speed = this.rb.linearVelocity;
				if (
					Mouse.isLeftDown &&
					!this.active &&
					this.rb &&
					!this.cooldown &&
					speed &&
					speed.sqrMagnitude <= 0.1 &&
					this.isEnabled
				) {
					print(this.isEnabled)
					this.rb.linearVelocity = Vector3.zero;
					this.oldPosition = this.position;

					this.instance = Instantiate(this.strengthBar);
					this.updateLocation(this.instance, undefined);

					this.pointer = Instantiate(this.shootingIndicator);
					this.updateLocation(this.pointer, 1);

					const graphics = this.pointer.GetComponentsInChildren<Image>(true);
					for (const graphic of graphics) {
						graphic.color = this.color;
					}
					this.active = true;
				}
			});

			Mouse.onLeftUp.Connect(() => {
				if (this.active) {
					if (this.rb) {
						const forward = new Vector3(this.rotation.x, 0, this.rotation.z).normalized;
						const force = forward
							.mul(
								((this.baseStrength * math.pow(this.strength * 2, 2)) / 4) * 3 +
									this.baseStrength * this.strength,
							)
							.mul(0.2 * this.strength + 1)
							.mul(this.rb.mass)
							.add(new Vector3(0, 2 * this.strength, 0));
						this.rb.AddForce(force, ForceMode.Impulse);
						this.counter += 1;
						this.holeText.text = `${this.counter < 10 ? "0" + this.counter : this.counter}`;
						this.cooldown = true;
						this.active = false;
						Destroy(this.instance);
						this.strength = 0;
					}
				}
			});
		}
	}
	protected override Update(dt: number): void {
		if (!Game.IsClient() || !this.rb) {
			return;
		}
		this.position = this.rb.transform.position;

		if (this.active) {
			if (this.camera) {
				const cameraForward = this.camera.transform.forward;
				const targetRotation = Quaternion.LookRotation(cameraForward, Vector3.up);
				this.rb.transform.rotation = targetRotation;
			}

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
			if (this?.rb.linearVelocity.sqrMagnitude <= 0.15) {
				this.rb.linearVelocity = Vector3.zero;
				this.cooldown = false;
				Destroy(this.pointer);
			}
			this.updating = false;
		}

		if (this.transform.position.y <= -15) {
			this.rb.position = this.oldPosition.add(new Vector3(0, 2, 0));
			this.rb.linearVelocity = Vector3.zero;
		}

		this.lastVelocity = this.rb.linearVelocity;
	}
}
