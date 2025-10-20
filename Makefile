.PHONY: up

up:
	@cd google-helper && \
	if [ -x node_modules/.bin/nodemon ]; then \
	  echo "Using local nodemon"; node_modules/.bin/nodemon server.js; \
	elif command -v nodemon >/dev/null 2>&1; then \
	  echo "Using global nodemon"; nodemon server.js; \
	else \
	  echo "nodemon không có sẵn, dùng node"; node server.js; \
	fi