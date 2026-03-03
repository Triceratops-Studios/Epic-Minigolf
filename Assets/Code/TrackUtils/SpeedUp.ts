export default class SpeedUp extends AirshipBehaviour {
	@Range(0.1, 50)
	declare public multiplier: number;

	protected OnTriggerEnter(collider: Collider): void {
		const rb = collider.gameObject.GetComponent<Rigidbody>();
		if (!rb) {
			return;
		}
		rb.AddForce(this.transform.forward.mul(this.multiplier), ForceMode.Impulse);
	}
}
