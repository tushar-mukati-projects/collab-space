FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun prisma generate

EXPOSE 4000
ENV PORT=4000
CMD ["bun", "src/index.ts"]