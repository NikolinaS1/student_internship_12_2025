package org.acme.services;

import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.acme.dtos.messages.MessageRequest;
import org.acme.models.Case;
import org.acme.models.Message;
import org.acme.models.User;
import org.acme.websockets.ChatSocket;

import java.util.List;

@ApplicationScoped
public class MessageService {
    @Inject
    ChatSocket chatSocket;

    public List<Message> getMessagesByCase(Long caseId){
        return Message.list("caseEntity.id", Sort.by("createdAt", Sort.Direction.Ascending), caseId);
    }

    @Transactional
    public Message saveMessage(MessageRequest messageRequest){
        Message message = new Message();
        Case caseEntity = Case.findById(messageRequest.caseId());
        User sender = User.findById(messageRequest.senderId());

        message.setCaseEntity(caseEntity);
        message.setSender(sender);
        message.setContent(messageRequest.content());
        message.setCreatedAt(java.time.LocalDateTime.now());

        message.persist();

        chatSocket.broadcast(messageRequest.caseId(),
            String.format("{\"senderId\": %d, \"senderName\": \"%s\", \"content\": \"%s\"}",
                messageRequest.senderId(),
                sender.getName(),
                messageRequest.content())
        );


        return message;
    }
}
