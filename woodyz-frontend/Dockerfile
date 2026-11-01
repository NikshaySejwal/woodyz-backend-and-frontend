# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy only application source and build configuration. This avoids bringing
# host node_modules, .next output, ignored environment files, or .git into the image.
COPY components ./components
COPY context ./context
COPY hooks ./hooks
COPY lib ./lib
COPY pages ./pages
COPY public ./public
COPY styles ./styles
COPY jsconfig.json next.config.mjs postcss.config.js tailwind.config.js ./

ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Install the exact dependency tree, build Next.js, then remove build-only
# packages in the same layer so they are absent from the final image layers.
RUN npm ci && npm run build && npm prune --omit=dev

# Switch to non-root user for security
USER node

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
