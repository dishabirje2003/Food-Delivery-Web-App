pipeline {
    agent any

    environment {
        MONGO_URI = credentials('mongo_uri')
    }

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/dishabirje2003/Food-Delivery-Web-App.git'
            }
        }

        // ================= BACKEND =================
        stage('Build Backend Image') {
            steps {
                dir('Backend') {
                    sh 'docker build -t food-backend-image .'
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                sh '''
                docker stop food-backend-container || true
                docker rm food-backend-container || true

                docker run -d \
                --name food-backend-container \
                -p 5000:5000 \
                --env MONGO_URI=$MONGO_URI \
                food-backend-image
                '''
            }
        }

        // ================= FRONTEND =================
        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t food-frontend-image -f Dockerfile.frontend .'
            }
        }

        stage('Deploy Frontend') {
            steps {
                sh '''
                docker stop food-frontend-container || true
                docker rm food-frontend-container || true

                docker run -d \
                --name food-frontend-container \
                -p 80:80 \
                food-frontend-image
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Full Application Deployed (Backend + Frontend)'
        }
        failure {
            echo '❌ Deployment Failed'
        }
    }
}
