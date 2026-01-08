pipeline {
    agent any

    environment {
        MONGO_URI = credentials('mongo_uri')
        EC2_HOST = "13.126.18.236"   // replace if EC2 IP changes
    }

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/dishabirje2003/Food-Delivery-Web-App.git'
            }
        }

        // ================= BACKEND =================
        stage('Deploy Backend to EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << EOF
                      cd ~
                      rm -rf Food-Delivery-Web-App
                      git clone https://github.com/dishabirje2003/Food-Delivery-Web-App.git
                      cd Food-Delivery-Web-App/Backend

                      docker stop food-backend-container || true
                      docker rm food-backend-container || true

                      docker build -t food-backend-image .
                      docker run -d \
                        --name food-backend-container \
                        -p 5000:5000 \
                        -e MONGO_URI=${MONGO_URI} \
                        food-backend-image
                    EOF
                    '''
                }
            }
        }

        // ================= FRONTEND =================
        stage('Deploy Frontend to EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << EOF
                      cd ~/Food-Delivery-Web-App

                      docker stop food-frontend-container || true
                      docker rm food-frontend-container || true

                      docker build -t food-frontend-image -f Dockerfile.frontend .
                      docker run -d \
                        --name food-frontend-container \
                        -p 80:80 \
                        food-frontend-image
                    EOF
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '✅ Backend + Frontend deployed successfully on AWS EC2!'
        }
        failure {
            echo '❌ Deployment failed. Check logs.'
        }
    }
}