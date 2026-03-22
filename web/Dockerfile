FROM oven/bun:1
WORKDIR /app

# install deps (cached)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# copy code
COPY . .

# disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# build-time envs
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_COLLAB_URL

# build app
RUN bun next build

# runtime config
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["bun", "server.js"]
