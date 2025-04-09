import { SQSClient, ReceiveMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({
    credentials :{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const init  = async () => {
    try {
        const command  = new ReceiveMessageCommand({
            QueueUrl : process.env.SQS_QUEUE_URL,
            MaxNumberOfMessages :  1
        })
    } catch (error) {
        
    }
}
