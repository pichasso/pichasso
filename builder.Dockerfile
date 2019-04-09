# ------------ builder ------------
# base image https://hub.docker.com/_/node/
FROM node:8.15-alpine as builder


######## PYTHON 27 ############ https://github.com/docker-library/python/blob/636e02777ea417851942e6e826fe5a6b4dee6f74/2.7/alpine3.9/Dockerfile

# ensure local python is preferred over distribution python
ENV PATH /usr/local/bin:$PATH

# http://bugs.python.org/issue19846
# > At the moment, setting "LANG=C" on a Linux system *fundamentally breaks Python 3*, and that's not OK.
ENV LANG C.UTF-8
# https://github.com/docker-library/python/issues/147
ENV PYTHONIOENCODING UTF-8

# install ca-certificates so that HTTPS works consistently
# other runtime dependencies for Python are installed later
RUN apk add --no-cache ca-certificates

ENV GPG_KEY C01E1CAD5EA2C4F0B8E3571504C367C218ADD4FF
ENV PYTHON_VERSION 2.7.16

RUN set -ex \
	&& apk add --no-cache --virtual .fetch-deps \
	gnupg \
	tar \
	xz \
	\
	&& wget -O python.tar.xz "https://www.python.org/ftp/python/${PYTHON_VERSION%%[a-z]*}/Python-$PYTHON_VERSION.tar.xz" \
	&& wget -O python.tar.xz.asc "https://www.python.org/ftp/python/${PYTHON_VERSION%%[a-z]*}/Python-$PYTHON_VERSION.tar.xz.asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --batch --keyserver ha.pool.sks-keyservers.net --recv-keys "$GPG_KEY" \
	&& gpg --batch --verify python.tar.xz.asc python.tar.xz \
	&& { command -v gpgconf > /dev/null && gpgconf --kill all || :; } \
	&& rm -rf "$GNUPGHOME" python.tar.xz.asc \
	&& mkdir -p /usr/src/python \
	&& tar -xJC /usr/src/python --strip-components=1 -f python.tar.xz \
	&& rm python.tar.xz \
	\
	&& apk add --no-cache --virtual .build-deps  \
	bzip2-dev \
	coreutils \
	dpkg-dev dpkg \
	expat-dev \
	findutils \
	gcc \
	gdbm-dev \
	libc-dev \
	libffi-dev \
	libnsl-dev \
	libtirpc-dev \
	linux-headers \
	make \
	ncurses-dev \
	openssl-dev \
	pax-utils \
	readline-dev \
	sqlite-dev \
	tcl-dev \
	tk \
	tk-dev \
	zlib-dev \
	# add build deps before removing fetch deps in case there's overlap
	&& apk del .fetch-deps \
	\
	&& cd /usr/src/python \
	&& gnuArch="$(dpkg-architecture --query DEB_BUILD_GNU_TYPE)" \
	&& ./configure \
	--build="$gnuArch" \
	--enable-shared \
	--enable-unicode=ucs4 \
	--with-system-expat \
	--with-system-ffi \
	&& make -j "$(nproc)" \
	# set thread stack size to 1MB so we don't segfault before we hit sys.getrecursionlimit()
	# https://github.com/alpinelinux/aports/commit/2026e1259422d4e0cf92391ca2d3844356c649d0
	EXTRA_CFLAGS="-DTHREAD_STACK_SIZE=0x100000" \
	&& make install \
	\
	&& find /usr/local -type f -executable -not \( -name '*tkinter*' \) -exec scanelf --needed --nobanner --format '%n#p' '{}' ';' \
	| tr ',' '\n' \
	| sort -u \
	| awk 'system("[ -e /usr/local/lib/" $1 " ]") == 0 { next } { print "so:" $1 }' \
	| xargs -rt apk add --no-cache --virtual .python-rundeps \
	&& apk del .build-deps \
	\
	&& find /usr/local -depth \
	\( \
	\( -type d -a \( -name test -o -name tests \) \) \
	-o \
	\( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
	\) -exec rm -rf '{}' + \
	&& rm -rf /usr/src/python \
	\
	&& python2 --version

# if this is called "PIP_VERSION", pip explodes with "ValueError: invalid truth value '<VERSION>'"
ENV PYTHON_PIP_VERSION 19.0.3

RUN set -ex; \
	\
	wget -O get-pip.py 'https://bootstrap.pypa.io/get-pip.py'; \
	\
	python get-pip.py \
	--disable-pip-version-check \
	--no-cache-dir \
	"pip==$PYTHON_PIP_VERSION" \
	; \
	pip --version; \
	\
	find /usr/local -depth \
	\( \
	\( -type d -a \( -name test -o -name tests \) \) \
	-o \
	\( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
	\) -exec rm -rf '{}' +; \
	rm -f get-pip.py

#CMD ["python2"]

######## OPENCV ############ https://github.com/julianbei/alpine-opencv-microimage/blob/master/python2/3.1.0/Dockerfile

RUN echo "@testing https://alpine.global.ssl.fastly.net/alpine/edge/testing/" >> /etc/apk/repositories
RUN echo "@community https://alpine.global.ssl.fastly.net/alpine/edge/community/" >> /etc/apk/repositories
RUN echo "@edge https://alpine.global.ssl.fastly.net/alpine/edge/main/" >> /etc/apk/repositories

RUN apk update && apk upgrade

RUN apk add --update --no-cache \
	# --virtual .build-deps \
	build-base \
	openblas-dev \
	unzip \
	wget \
	cmake \

	#Intel® TBB, a widely used C++ template library for task parallelism'
	libtbb@testing  \
	libtbb-dev@testing   \

	# Wrapper for libjpeg-turbo
	libjpeg  \

	# accelerated baseline JPEG compression and decompression library
	libjpeg-turbo-dev \

	# Portable Network Graphics library
	libpng-dev \

	# A software-based implementation of the codec specified in the emerging JPEG-2000 Part-1 standard (development files)
	jasper-dev \

	# Provides support for the Tag Image File Format or TIFF (development files)
	tiff-dev \

	# Libraries for working with WebP images (development files)
	libwebp-dev \

	# A C language family front-end for LLVM (development files)
	clang-dev \

	linux-headers 

RUN pip install numpy

ENV CC /usr/bin/clang
ENV CXX /usr/bin/clang++

# RUN mkdir /opt && cd /opt && \
RUN cd /opt && \
	wget https://github.com/opencv/opencv/archive/3.1.0.zip && \
	unzip 3.1.0.zip && \
	cd /opt/opencv-3.1.0 && \
	mkdir build && \
	cd build && \
	cmake -D CMAKE_BUILD_TYPE=RELEASE -D CMAKE_INSTALL_PREFIX=/usr/local -D WITH_FFMPEG=NO \
	-D WITH_IPP=NO -D WITH_OPENEXR=NO .. && \
	make VERBOSE=1 && \
	make && \
	make install

RUN rm -rf /var/cache/apk/*

######## PUPPETEER ############ https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-on-alpine

# Installs latest Chromium (72) package.
RUN apk update && apk upgrade && \
	echo @edgeChrome http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
	echo @edgeChrome http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
	apk add --no-cache \
	chromium@edgeChrome \
	nss@edgeChrome \
	freetype@edgeChrome \
	harfbuzz@edgeChrome \
	ttf-freefont@edgeChrome

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Puppeteer v1.11.0 works with Chromium 72.
# RUN npm install puppeteer@1.11.0

# # Add user so we don't need --no-sandbox.
# RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
#   && mkdir -p /home/pptruser/Downloads \
#   && chown -R pptruser:pptruser /home/pptruser \
#   && mkdir -p /app \
#   && chown -R pptruser:pptruser /app

# # Run everything after as non-privileged user.
# USER pptruser


######## VIPS ############ https://sharp.dimens.io/en/stable/install/#alpine-linux

RUN apk add vips-dev@testing fftw-dev@edge build-base@edge --update-cache 

######## PICHASSO ############

WORKDIR /usr/src/app   

COPY package.json package.json

RUN ls -lah

RUN set -x && \
	npm set progress=true && \
	npm config set depth 0 && \
	npm install --dev
