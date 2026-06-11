from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

# Simple in-memory database (replace with real DB later)
users_db = {}

# Models
class User:
    def __init__(self, user_id, name, email, bio, profession, location, avatar_url):
        self.user_id = user_id
        self.name = name
        self.email = email
        self.bio = bio
        self.profession = profession
        self.location = location
        self.avatar_url = avatar_url
        self.created_at = datetime.now().isoformat()
        self.connections = []
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'bio': self.bio,
            'profession': self.profession,
            'location': self.location,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at,
            'connections_count': len(self.connections)
        }

# Health check
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'Server is running'}), 200

# Get all users
@app.route('/api/users', methods=['GET'])
def get_users():
    users_list = [user.to_dict() for user in users_db.values()]
    return jsonify({'users': users_list, 'total': len(users_list)}), 200

# Get user by ID
@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    if user_id in users_db:
        user = users_db[user_id]
        user_data = user.to_dict()
        user_data['connections'] = user.connections
        return jsonify(user_data), 200
    return jsonify({'error': 'User not found'}), 404

# Create new user
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    
    # Validation
    required_fields = ['name', 'email', 'profession', 'location']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Generate user ID
    user_id = f"user_{len(users_db) + 1}"
    
    # Create user
    user = User(
        user_id=user_id,
        name=data['name'],
        email=data['email'],
        bio=data.get('bio', ''),
        profession=data['profession'],
        location=data['location'],
        avatar_url=data.get('avatar_url', 'https://via.placeholder.com/150')
    )
    
    users_db[user_id] = user
    
    return jsonify({
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

# Update user profile
@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    if user_id not in users_db:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    user = users_db[user_id]
    
    # Update fields
    if 'name' in data:
        user.name = data['name']
    if 'bio' in data:
        user.bio = data['bio']
    if 'profession' in data:
        user.profession = data['profession']
    if 'location' in data:
        user.location = data['location']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200

# Connect users (add connection)
@app.route('/api/users/<user_id>/connect/<target_user_id>', methods=['POST'])
def connect_users(user_id, target_user_id):
    if user_id not in users_db or target_user_id not in users_db:
        return jsonify({'error': 'User not found'}), 404
    
    user = users_db[user_id]
    target_user = users_db[target_user_id]
    
    # Add connection if not already connected
    if target_user_id not in user.connections:
        user.connections.append(target_user_id)
    if user_id not in target_user.connections:
        target_user.connections.append(user_id)
    
    return jsonify({
        'message': 'Connected successfully',
        'connections': user.connections
    }), 200

# Get user connections
@app.route('/api/users/<user_id>/connections', methods=['GET'])
def get_connections(user_id):
    if user_id not in users_db:
        return jsonify({'error': 'User not found'}), 404
    
    user = users_db[user_id]
    connections = [users_db[conn_id].to_dict() for conn_id in user.connections]
    
    return jsonify({
        'user_id': user_id,
        'connections': connections,
        'total': len(connections)
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
