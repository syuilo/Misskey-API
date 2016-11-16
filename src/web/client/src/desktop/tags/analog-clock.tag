mk-analog-clock
	canvas@canvas(width='256', height='256')

script.
	self = @

	draw!
	set-interval draw, 1000ms

	function draw
		now = new Date!
		s = now.get-seconds!
		m = now.get-minutes!
		h = now.get-hours!

		vec2 = (x, y) ->
			@x = x
			@y = y

		canvas = self.canvas
		ctx = canvas.get-context \2d
		canv-w = canvas.width
		canv-h = canvas.height
		ctx.clear-rect 0, 0, canv-w, canv-h

		# 背景
		center = (Math.min (canv-w / 2), (canv-h / 2))
		line-start = center * 0.90
		line-end-short = center * 0.87
		line-end-long = center * 0.84
		for i from 0 to 59 by 1
			angle = Math.PI * i / 30
			uv = new vec2 (Math.sin angle), (-Math.cos angle)
			ctx.begin-path!
			ctx.line-width = 1
			ctx.move-to do
				(canv-w / 2) + uv.x * line-start
				(canv-h / 2) + uv.y * line-start
			if i % 5 == 0
				ctx.stroke-style = 'rgba(255, 255, 255, 0.2)'
				ctx.line-to do
					(canv-w / 2) + uv.x * line-end-long
					(canv-h / 2) + uv.y * line-end-long
			else
				ctx.stroke-style = 'rgba(255, 255, 255, 0.1)'
				ctx.line-to do
					(canv-w / 2) + uv.x * line-end-short
					(canv-h / 2) + uv.y * line-end-short
			ctx.stroke!

		# 分
		angle = Math.PI * (m + s / 60) / 30
		length = (Math.min canv-w, canv-h) / 2.6
		uv = new vec2 (Math.sin angle), (-Math.cos angle)
		ctx.begin-path!
		ctx.stroke-style = \#ffffff
		ctx.line-width = 2
		ctx.move-to do
			(canv-w / 2) - uv.x * length / 5
			(canv-h / 2) - uv.y * length / 5
		ctx.line-to do
			(canv-w / 2) + uv.x * length
			(canv-h / 2) + uv.y * length
		ctx.stroke!

		# 時
		angle = Math.PI * (h % 12 + m / 60) / 6
		length = (Math.min canv-w, canv-h) / 4
		uv = new vec2 (Math.sin angle), (-Math.cos angle)
		ctx.begin-path!
		#ctx.stroke-style = \#ffffff
		ctx.stroke-style = CONFIG.theme-color
		ctx.line-width = 2
		ctx.move-to do
			(canv-w / 2) - uv.x * length / 5
			(canv-h / 2) - uv.y * length / 5
		ctx.line-to do
			(canv-w / 2) + uv.x * length
			(canv-h / 2) + uv.y * length
		ctx.stroke!

		# 秒
		angle = Math.PI * s / 30
		length = (Math.min canv-w, canv-h) / 2.6
		uv = new vec2 (Math.sin angle), (-Math.cos angle)
		ctx.begin-path!
		ctx.stroke-style = 'rgba(255, 255, 255, 0.5)'
		ctx.line-width = 1
		ctx.move-to do
			(canv-w / 2) - uv.x * length / 5
			(canv-h / 2) - uv.y * length / 5
		ctx.line-to do
			(canv-w / 2) + uv.x * length
			(canv-h / 2) + uv.y * length
		ctx.stroke!

style.
	> canvas
		display block
		width 256px
		height 256px
