export default class MusicPlayer extends AirshipBehaviour {
	declare public music: AudioClip[];
	declare public player: AudioSource;
	private current: number = 0;

	override Start(): void {
		while (true) {
			this.player.resource = this.music[this.current % 10];
			this.current += 1;
			this.player.Play();
			while (this.player.isPlaying) {
				task.wait();
			}
		}
	}
}
