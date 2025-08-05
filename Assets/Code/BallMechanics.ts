import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { ControlScheme, Mouse, Preferred, Touchscreen } from "@Easy/Core/Shared/UserInput";
import { Game } from "@Easy/Core/Shared/Game";
import { ActionInputType } from "@Easy/Core/Shared/Input/InputUtil";

import ColorPallette from "./ColorPallette";

export default class BallMechanics extends AirshipBehaviour {
	private strength = 0;
	private change = 1;
	private active = false;
	private cooldown = false;
	private instance: GameObject;
	private pointer: GameObject;
	private character: Character | undefined;

	public declare strengthBar: GameObject;
	public declare shootingIndicator: GameObject;
	public declare baseStrength: number;

	private color = ColorPallette.random();

	override Start(): void {
		if (Game.IsClient()) {
			this.character = Game.localPlayer.character;
			const camera = Airship.Camera.cameraRig?.mainCamera;

			Mouse.onLeftDown.Connect(() => {
				const screenPosition = Mouse.position;
				task.wait(0.1);
				const speed = this.character?.movement.GetVelocity();
				if (Mouse.isLeftDown && !this.active && this.character && !this.cooldown) {
					this.character?.movement.SetVelocity(Vector3.zero);

					this.active = true;
					this.instance = Instantiate(this.strengthBar);
					const position = this.character.transform.position;
					this.instance.transform.position = position;

					this.pointer = Instantiate(this.shootingIndicator);
					this.pointer.transform.position = position;

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
							.mul(this.baseStrength * (this.strength + 0.07))
							.add(new Vector3(0, 5 * this.strength, 0));
						this.character.movement.AddImpulse(force);
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
		if (this.active) {
			const lookVec = this.character.movement.GetLookVector();
			const angleY = math.atan2(lookVec.x, lookVec.z) * (180 / math.pi);
			if (this.pointer) {
				this.pointer.transform.rotation = Quaternion.Euler(90, angleY, 0);
			}

			this.strength += this.change * dt;
			this.strength = math.clamp(this.strength, 0, 1);

			if (this.strength <= 0 || this.strength >= 1) {
				this.change *= -1;
			}

			const background = this.instance.transform.Find("Background");
			const bar = background?.transform.Find("Strength");
			if (bar) {
				bar.transform.localScale = new Vector3(1, this.strength, 1);
				// const shake = background.GetComponent<EasyShake>
				// if (shake) {
				// 	shake.maxPositionOffset = Vector3.one.mul(0.08 * this.strength)
				// 	shake.maxRotationOffsetAngles = Vector3.one.mul(12 * this.strength)
				// }
			}
		} else if (this.cooldown && this.pointer && this.character) {
			this.pointer.transform.position = this.character.transform.position;

			const circle = this.pointer.transform.Find("Circle");
			if (circle) {
				const graphic = circle.GetComponent<Image>();
				if (graphic) {
					graphic.color = new Color(1, 1, 1, 0);
				}
				task.wait(0.1);
			}

			const speed = this.character.movement.GetVelocity();
			if (speed.magnitude <= 0.1) {
				this.cooldown = false;
				Destroy(this.pointer);
			}
		} else if (!this.cooldown) {
		}
	}
}
