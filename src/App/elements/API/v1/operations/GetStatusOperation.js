import ApiInstance from "../Api.js"
class GetStatusOperation {
	constructor({
		path = "/",
		withContent = false,
		thenCB = () => {},
		catchCB = () => {},
		...rest
	}) {

		let timestart = new Date().getTime()

		this.path = path;
		this.thenCB = thenCB;
		this.catchCB = catchCB;

		ApiInstance.instance.fetch({
				apiArg: {
					path: this.path,
					withContent: withContent,
					op: "getstatus",
					...rest
				}
			})
			.then(x => {
				let timeend = new Date().getTime()
				if (x.status == "ok") {
					this.thenCB({ ...x,
						time: timeend - timestart
					})
				} else if (x.status == "error") {
					this.catchCB({ ...x,
						time: timeend - timestart
					})
				}
			})
			.catch(x => {

				this.catchCB({
					status: "error",
					...x
				})

			})


	}

}

export default GetStatusOperation;