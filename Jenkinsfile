pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'playlisthub'
        TAG = "${env.BUILD_NUMBER}"
    }

    triggers {
        githubPush()            // Triggered automatically by GitHub webhook via ngrok
        pollSCM('H/2 * * * *')  // Fallback automatic trigger checking every 2 minutes
    }

    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            // Quality Gate: Runs unit and lint tests inside Docker.
            // A failure here immediately blocks deployment!
            parallel {
                stage('Test: songs-api') {
                    steps {
                        sh 'docker build --target test -t playlisthub/songs-api:test ./songs-api'
                    }
                }
                stage('Test: playlist-api') {
                    steps {
                        sh 'docker build --target test -t playlisthub/playlist-api:test ./playlist-api'
                    }
                }
            }
        }

        stage('Build Images') {
            steps {
                // Builds application images tagged with current BUILD_NUMBER
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                // Injects production environment secrets from Jenkins Credentials
                withCredentials([file(credentialsId: 'playlisthub-env', variable: 'ENV_FILE')]) {
                    sh 'cp "$ENV_FILE" .env'
                    sh 'docker compose up -d --no-build --remove-orphans'
                }
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                  echo "Verifying deployment health and build label..."
                  for i in $(seq 1 15); do
                    if docker compose exec -T proxy wget -qO- http://localhost/api/songs/health \
                    && docker compose exec -T proxy wget -qO- http://localhost/api/playlists/health \
                    && docker compose exec -T proxy wget -qO- http://localhost/ | grep -q "Build #${TAG}"; then
                      echo "Smoke test PASSED! Build ${TAG} is live."
                      exit 0
                    fi
                    echo "Waiting for services to become healthy... (attempt $i/15)"
                    sleep 4
                  done
                  echo "Smoke test FAILED!"
                  docker compose ps
                  exit 1
                '''
            }
        }
    }

    post {
        success {
            echo "SUCCESS: PlaylistHub Build ${TAG} deployed successfully at http://localhost:8080"
        }
        failure {
            echo "FAILURE: Build ${TAG} failed. If failure occurred before Deploy, system remains on previous build."
            echo "To rollback, run the 'playlisthub-rollback' job or use TAG=<previous_build> docker compose up -d --no-build"
        }
        always {
            // Guarantee secret cleanup after pipeline execution
            sh 'rm -f .env'
        }
    }
}
