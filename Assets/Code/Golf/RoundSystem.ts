import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Team } from "@Easy/Core/Shared/Team/Team";
import ColorPallette from "Minigolf/Settings/ColorPallette";

export default class RoundSystem extends AirshipBehaviour {
	public static status = "intermission"; //intermission, setup, cleanup, running, waiting

	static scores: { [name: string]: {} } = {};
	private exampleScore: { [round: number]: number } = {};

	private intermission = 15;
	private rounds = 8;
	private team: Team;
	private updating = false;
	private wait = 0;
	private pending: string | undefined;

	protected JoinRound(player: Player): void {
		this.team.AddPlayer(player);
	}

	override Start(): void {
		if (!Game.IsServer()) {
			return;
		}
	}
	override Update(dt: number): void {
		if (!Game.IsServer() || this.updating) {
			return;
		}
		this.updating = true;

		switch (RoundSystem.status) {
			case "intermission":
				this.team = new Team("In Round", "inround", ColorPallette.palette[5]);
				Airship.Teams.RegisterTeam(this.team);
				for (let i = this.intermission; i > 0; i--) {
					//message players to join
					task.wait(1);
				}
				RoundSystem.status = "setup";
				break;

			case "setup":
				RoundSystem.status = "running";
				break;

			case "running":
				RoundSystem.status = "cleanup";
				break;

			case "cleanup":
				Airship.Teams.RemoveTeam(this.team);
				RoundSystem.scores = {};
				break;

			case "waiting":
				for (let i = this.wait; i > 0; i--) {
					//message players to join
					task.wait(1);
				}
				this.wait = 0;
				RoundSystem.status = this.pending || "Intermission";
				break;
		}
		this.updating = false;
	}
}
