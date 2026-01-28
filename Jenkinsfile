pipeline {
    agent any

    environment {
        MONGO_URI  = credentials('mongo_uri')
        EC2_HOST   = "13.126.18.236"
        DOCKER_USER = "birjedisha"
    }

    stages {

        stage('Checkout SCM') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/dishabirje2003/Food-Delivery-Web-App.git'
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

        // ================= FRONTEND =================
        stage('Build Frontend Image') {
            steps {
                sh 'docker build -t food-frontend-image -f Dockerfile.frontend .'
            }
        }

        /*stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                    echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

                    docker tag food-backend-image $DH_USER/food-backend:latest
                    docker tag food-frontend-image $DH_USER/food-frontend:latest

                    docker push --progress=plain $DH_USER/food-backend:latest
                    docker push --progress=plain $DH_USER/food-frontend:latest
                    '''
                }
            }
        }*/
        stage('Push Images to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS'
                )]) {
                    sh '''
                    echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin

                    docker tag food-backend-image $DH_USER/food-backend:latest
                    docker tag food-frontend-image $DH_USER/food-frontend:latest

                    docker push $DH_USER/food-backend:latest
                    docker push $DH_USER/food-frontend:latest
                    '''
                }
            }
}


        /*stage('Deploy Backend on EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh """
                ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << 'EOF'
                docker stop food-backend-container || true
                docker rm food-backend-container || true

                docker pull ${DOCKER_USER}/food-backend:latest

                docker run -d \
                --name food-backend-container \
                -p 5000:5000 \
                -e MONGO_URI=${MONGO_URI} \
                ${DOCKER_USER}/food-backend:latest
                EOF
                """
                }
            }
        }*/
        stage('Deploy Backend on EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                ssh -o StrictHostKeyChecking=no ubuntu@13.126.18.236 << EOF
                docker stop food-backend-container || true
                docker rm food-backend-container || true

                docker pull birjedisha/food-backend:latest

                docker run -d \
                --name food-backend-container \
                -p 5000:5000 \
                -e MONGO_URI="$MONGO_URI" \
                birjedisha/food-backend:latest
                EOF
                '''
                }
            }
        }


        stage('Deploy Frontend on EC2') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh """
                ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << 'EOF'
                docker stop food-frontend-container || true
                docker rm food-frontend-container || true

                docker pull ${DOCKER_USER}/food-frontend:latest

                docker run -d \
                --name food-frontend-container \
                -p 80:80 \
                ${DOCKER_USER}/food-frontend:latest
                EOF
                """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Full Application Deployed Successfully on AWS EC2!'
        }
        failure {
            echo '❌ Deployment Failed. Check logs.'
        }
    }
}