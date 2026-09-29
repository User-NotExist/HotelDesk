pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        HOST_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build and verify') {
            steps {
                sh 'APP_ENV_FILE=.env.docker.example IMAGE_TAG="$BUILD_NUMBER" docker compose build app'
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'hotel-desk-env', variable: 'ENV_FILE')]) {
                    sh '''
                        set -eu
                        set +x
                        export APP_ENV_FILE="$ENV_FILE"
                        export IMAGE_TAG="$BUILD_NUMBER"

                        docker compose run --rm --no-deps app sh -c '
                            test "$DATABASE_URL" = file:./data/dev.db || {
                                echo "The Jenkins .env file must set DATABASE_URL=file:./data/dev.db" >&2
                                exit 1
                            }
                            bunx --bun prisma migrate deploy --config prisma7.config.ts
                        '
                        docker compose up --detach --no-deps --wait --wait-timeout 60 app
                    '''
                }
            }
        }
    }
}
