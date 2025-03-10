<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->onDelete('cascade');
            $table->string('sender_type');  // 'visitor', 'agent', 'system', 'ai'
            $table->unsignedBigInteger('sender_id');  // references visitors.id or agents.id based on sender_type
            $table->text('content');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        // Create indexes for better performance
        Schema::table('messages', function (Blueprint $table) {
            $table->index('conversation_id');
            $table->index(['sender_type', 'sender_id']);
            $table->index('created_at');
            $table->index('is_read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
