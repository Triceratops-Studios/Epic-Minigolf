import { Airship } from "@Easy/Core/Shared/Airship";
import Character from "@Easy/Core/Shared/Character/Character";
import { Game } from "@Easy/Core/Shared/Game";
import { Player } from "@Easy/Core/Shared/Player/Player";
import { Team } from "@Easy/Core/Shared/Team/Team";
import TrackSpawner from "./TrackSpawner";
import ColorPallette from "Minigolf/Settings/ColorPallette";

export default class RoundSystem extends AirshipBehaviour {
	public static status = "intermission"; //intermission, setup, cleanup, running, waiting, starting

	static scores: { [name: string]: {} } = {};
	private exampleScore: { [round: number]: number } = {};

	private intermission = 15;
	private rounds = 8;
	private currentRound = 1;
	private wait = 0;
	private timer = 30;

	private team: Team;
	private updating = false;
	private pending: string | undefined;

	private tracks = new Array<GameObject>();
	private currentTrack: GameObject;

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
		print(RoundSystem.status)

		switch (RoundSystem.status) {
			case "intermission":
				this.team = new Team("In Round", "inround", ColorPallette.palette[5]);
				Airship.Teams.RegisterTeam(this.team);
				for (let i = this.intermission; i > 0; i--) {
					//message players to join
					task.wait(1);
				}
				RoundSystem.status = "starting";
				break;

			case "starting":
				let gameTracks = TrackSpawner.getTracks();

				for (let i = this.rounds; i > 0; i--) {
					const index = math.random(1, gameTracks.size()) - 1;
					this.tracks.push(gameTracks[index]);
					gameTracks.remove(index);
				}
				RoundSystem.status = "setup";
				break;

			case "setup":
				this.currentRound += 1
				const track = this.tracks.shift();
				if (track) {
					RoundSystem.status = "running";
					this.timer = ((TrackSpawner.getTrackInfo(track)?.difficulty || 1) -1) * 15 + 30;
					TrackSpawner.spawnTrack(track)
				}
				break;

			case "running":
				RoundSystem.status = "cleanup";
				const timerText = GameObject.Find("TimerText")?.GetComponent<TMP_Text>();
				for (let i = this.timer; i > 0; i--) {
					const min = math.floor(i / 60);
					const sec = i % 60

					if (timerText) {
						timerText.text = `${min}:${sec < 10 ? "0" + sec : sec}`;
					}
					task.wait(1);
				}
				break;

			case "cleanup":
				if (this.currentTrack) {
					Destroy(this.currentTrack);
				}
				if (this.currentRound >= this.rounds) {
					Airship.Teams.RemoveTeam(this.team);
					RoundSystem.scores = {};
					RoundSystem.status = "waiting";
					this.currentRound = 1;
					this.timer = 30;
					break;
				}

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
