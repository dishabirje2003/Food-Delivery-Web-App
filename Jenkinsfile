pipeline {
    agent any

    environment {
        MONGO_URI = credentials('mongo_uri')
        EC2_HOST = "13.126.18.236"
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

        stage('Deploy Backend to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} '
                        docker stop food-backend-container || true
                        docker rm food-backend-container || true
                        docker run -d \
                        --name food-backend-container \
                        -p 5000:5000 \
                        -e MONGO_URI=${MONGO_URI} \
                        food-backend-image
                    '
                    """
                }
            }
        }

        // ================= FRONTEND =================
        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t food-frontend-image -f Dockerfile.frontend .'
            }
        }

        stage('Deploy Frontend to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} '
                        docker stop food-frontend-container || true
                        docker rm food-frontend-container || true
                        docker run -d \
                        --name food-frontend-container \
                        -p 80:80 \
                        food-frontend-image
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Application successfully deployed to AWS EC2!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}