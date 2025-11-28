import { HttpCore,ClientOptions } from "./http";
import { LocationsClient } from "./resources/locations";
import { SessionsClient } from "./resources/sessions";
import { VerificationsClient } from "./resources/verifications";

export class Client {
	private core: HttpCore;

	readonly locations: LocationsClient;
	readonly sessions: SessionsClient;
	readonly verifications: VerificationsClient;

	constructor(opts: ClientOptions) {
		this.core = new HttpCore(opts);
		this.locations = new LocationsClient(this.core);
		this.sessions = new SessionsClient(this.core);
		this.verifications = new VerificationsClient(this.core);
	}
}