import { Asset } from "@Easy/Core/Shared/Asset";
import TrackComponent from "./TrackComponent";

export default class TrackSpawner extends AirshipBehaviour {
	static getTracks(): GameObject[] {
		const tracksFolder = Asset.LoadAsset<GameObject[]>("Minigolf/Tracks");

		const tracks: GameObject[] = [];
		for (let i = 0; i < tracksFolder.size(); i++) {
			const track = tracksFolder[i];
			if (track.GetAirshipComponent<TrackComponent>()) {
				tracks.push(track);
			}
		}
		return tracks;
	}

	static getTrackInfo(track: number | GameObject): { name: string, difficulty: number } | undefined {
		if (typeIs(track, "number")) {
			track = this.getTracks()[track + 1];
		}

		if (!track) {return}

		const info = track.GetAirshipComponent<TrackComponent>();
		if (!info) {return}

		return {
			name: info.name,
			difficulty: info.difficulty //1 - easy, 2 - neutral, 3 - medium, 4 - hard, 5 - extreme
		};
	}

	static spawnTrack(track: number | GameObject): GameObject | undefined {
		if (typeIs(track, "number")) {
			track = this.getTracks()[track + 1];
		}

		if (!track) {return}
		track = Instantiate(track);
		return track;
	}
}
