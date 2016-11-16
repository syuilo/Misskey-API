mk-ui
	div.global@global
		mk-ui-header@header(ready={ ready })
		mk-ui-nav@nav(ready={ ready })

		div.content@main
			<yield />

	mk-stream-indicator

style.
	display block

script.
	@mixin \stream

	@ready-count = 0

	#@ui.on \notification (text) ~>
	#	alert text

	@on \mount ~>
		@stream.on \notification @on-stream-notification
		@ready!

	@on \unmount ~>
		@stream.off \notification @on-stream-notification
		@slide.slide-close!

	@ready = ~>
		@ready-count++

		if @ready-count == 2
			@slide = SpSlidemenu @main, @nav, \#hamburger {direction: \left}
			@init-view-position!

	@init-view-position = ~>
		top = @header.offset-height
		@main.style.padding-top = top + \px
		@nav.style.margin-top = top + \px
		@nav.query-selector '.body > .content' .style.padding-bottom = top + \px

	@on-stream-notification = (notification) ~>
		el = document.body.append-child document.create-element \mk-notify
		riot.mount el, do
			notification: notification
